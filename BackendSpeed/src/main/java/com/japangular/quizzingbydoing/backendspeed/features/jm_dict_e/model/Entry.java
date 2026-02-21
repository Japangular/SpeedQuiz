package com.japangular.quizzingbydoing.backendspeed.features.jm_dict_e.model;

import jakarta.xml.bind.annotation.*;
import lombok.Data;

import java.util.List;

@Data
@XmlRootElement(name = "entry")
@XmlAccessorType(XmlAccessType.FIELD)
public class Entry {

  @XmlElement(name = "ent_seq")
  private int entSeq;

  @XmlElement(name = "k_ele")
  private List<KElement> kEle;

  @XmlElement(name = "r_ele")
  private List<RElement> rEle;

  @XmlElement(name = "sense")
  private List<Sense> sense;

  @Data
  @XmlAccessorType(XmlAccessType.FIELD)
  public static class KElement {
    @XmlElement(name = "keb")
    private String keb;

    @XmlElement(name = "ke_inf")
    private List<String> keInf;

    @XmlElement(name = "ke_pri")
    private List<String> kePri;
  }

  @Data
  @XmlAccessorType(XmlAccessType.FIELD)
  public static class RElement {
    @XmlElement(name = "reb")
    private String reb;

    @XmlElement(name = "re_inf")
    private List<String> reInf;

    @XmlElement(name = "re_pri")
    private List<String> rePri;
  }

  @Data
  @XmlAccessorType(XmlAccessType.FIELD)
  public static class Sense {
    @XmlElement(name = "pos")
    private List<String> pos;

    @XmlElement(name = "xref")
    private List<String> xref;

    @XmlElement(name = "ant")
    private List<String> ant;

    @XmlElement(name = "field")
    private List<String> field;

    @XmlElement(name = "misc")
    private List<String> misc;

    @XmlElement(name = "s_inf")
    private List<String> sInf;

    @XmlElement(name = "lsource")
    private List<LSource> lsource;

    @XmlElement(name = "dial")
    private List<String> dial;

    @XmlElement(name = "gloss")
    private List<String> gloss;
  }

  @Data
  @XmlAccessorType(XmlAccessType.FIELD)
  public static class LSource {
    @XmlValue
    private String value;

    @XmlAttribute(name = "lang")
    private String lang;

    @XmlAttribute(name = "ls_type")
    private String lsType;

    @XmlAttribute(name = "wasei")
    private String wasei;
  }
}

